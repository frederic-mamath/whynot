
render-get-ip:
    dig +short https://whynot-backend-1sgz.onrender.com

aws-get-security-group-id:
	aws ec2 describe-security-groups \
	--filters Name=group-name,Values=whynot-worker-sg \
	--query 'SecurityGroups[0].GroupId' \
	--output text

aws-get-security-group-description:
	aws ec2 describe-security-groups \
	--group-ids $SG_ID \
	--query 'SecurityGroups[0].IpPermissions[?ToPort==`3001`]' \
	--output table
