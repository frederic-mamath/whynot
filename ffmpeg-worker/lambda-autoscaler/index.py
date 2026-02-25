import boto3
import redis
import os
import json
from datetime import datetime

ec2 = boto3.client("ec2", region_name="eu-west-3")
ssm = boto3.client("ssm", region_name="eu-west-3")
cloudwatch = boto3.client("cloudwatch", region_name="eu-west-3")

SPOT_REQUEST_ID = os.environ["SPOT_REQUEST_ID"]
IDLE_THRESHOLD_MINUTES = int(os.environ.get("IDLE_THRESHOLD_MINUTES", 15))


def get_redis_client():
    """Get Redis client from Parameter Store"""
    redis_url = ssm.get_parameter(Name="/whynot/redis-url", WithDecryption=True)[
        "Parameter"
    ]["Value"]

    return redis.from_url(redis_url)


def get_instance_id():
    """Get EC2 instance ID from Spot request"""
    response = ec2.describe_spot_instance_requests(
        SpotInstanceRequestIds=[SPOT_REQUEST_ID]
    )

    if not response["SpotInstanceRequests"]:
        return None

    request = response["SpotInstanceRequests"][0]

    if request["State"] != "active":
        return None

    return request.get("InstanceId")


def get_instance_state(instance_id):
    """Get current state of EC2 instance"""
    response = ec2.describe_instances(InstanceIds=[instance_id])
    state = response["Reservations"][0]["Instances"][0]["State"]["Name"]
    return state


def get_queue_stats():
    """Get Redis queue statistics"""
    r = get_redis_client()

    # Get queue keys (BullMQ pattern)
    active_key = "bull:ffmpeg-relay:active"
    waiting_key = "bull:ffmpeg-relay:wait"

    active_count = r.llen(active_key)
    waiting_count = r.llen(waiting_key)

    return {
        "active": active_count,
        "waiting": waiting_count,
        "total": active_count + waiting_count,
    }


def start_instance(instance_id):
    """Start EC2 instance"""
    print(f"Starting instance: {instance_id}")
    ec2.start_instances(InstanceIds=[instance_id])

    # Send metric to CloudWatch
    cloudwatch.put_metric_data(
        Namespace="WhyNot/FFmpegWorker",
        MetricData=[
            {
                "MetricName": "AutoScaleStart",
                "Value": 1,
                "Unit": "Count",
                "Timestamp": datetime.utcnow(),
            }
        ],
    )


def stop_instance(instance_id):
    """Stop EC2 instance"""
    print(f"Stopping instance: {instance_id}")
    ec2.stop_instances(InstanceIds=[instance_id])

    # Send metric to CloudWatch
    cloudwatch.put_metric_data(
        Namespace="WhyNot/FFmpegWorker",
        MetricData=[
            {
                "MetricName": "AutoScaleStop",
                "Value": 1,
                "Unit": "Count",
                "Timestamp": datetime.utcnow(),
            }
        ],
    )


def get_last_activity_time():
    """Get last activity time from CloudWatch or Redis"""
    # For now, check if there are any jobs
    # In production, you'd track this more accurately
    stats = get_queue_stats()
    if stats["total"] > 0:
        return datetime.utcnow()

    # Check CloudWatch for last activity
    # This is a simplified version
    return None


def lambda_handler(event, context):
    """Main Lambda handler"""
    print(f"Auto-scaler triggered at {datetime.utcnow()}")

    try:
        # Get instance ID
        instance_id = get_instance_id()
        if not instance_id:
            print("No active Spot instance found")
            return {"statusCode": 200, "body": json.dumps({"status": "no_instance"})}

        # Get instance state
        state = get_instance_state(instance_id)
        print(f"Instance {instance_id} is {state}")

        # Get queue stats
        queue_stats = get_queue_stats()
        print(f"Queue stats: {queue_stats}")

        # Send metrics to CloudWatch
        cloudwatch.put_metric_data(
            Namespace="WhyNot/FFmpegWorker",
            MetricData=[
                {
                    "MetricName": "QueueActive",
                    "Value": queue_stats["active"],
                    "Unit": "Count",
                },
                {
                    "MetricName": "QueueWaiting",
                    "Value": queue_stats["waiting"],
                    "Unit": "Count",
                },
            ],
        )

        # Decision logic
        has_jobs = queue_stats["total"] > 0

        if has_jobs and state == "stopped":
            start_instance(instance_id)
            return {
                "statusCode": 200,
                "body": json.dumps(
                    {"status": "started", "instance": instance_id, "queue": queue_stats}
                ),
            }

        elif not has_jobs and state == "running":
            # Check if idle for long enough
            # For now, just stop immediately (you can add idle timer logic)
            print(f"No jobs in queue, stopping instance")
            stop_instance(instance_id)
            return {
                "statusCode": 200,
                "body": json.dumps(
                    {"status": "stopped", "instance": instance_id, "queue": queue_stats}
                ),
            }

        else:
            return {
                "statusCode": 200,
                "body": json.dumps(
                    {"status": "no_action", "state": state, "queue": queue_stats}
                ),
            }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
