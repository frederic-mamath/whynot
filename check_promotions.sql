-- Check promoted products structure
SELECT 'vendor_promoted_products' as table_name, vpp.*, p.name as product_name, c.name as channel_name
FROM vendor_promoted_products vpp
LEFT JOIN products p ON p.id = vpp.product_id
LEFT JOIN channels c ON c.id = vpp.channel_id
LIMIT 10;
