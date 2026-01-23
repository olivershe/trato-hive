#!/bin/bash
# LocalStack S3 initialization script
# This runs automatically when LocalStack starts

set -e

echo "Setting up S3 bucket for Trato Hive..."

# Create the bucket if it doesn't exist
awslocal s3 mb s3://trato-hive-documents 2>/dev/null || echo "Bucket already exists"

# Configure CORS for browser uploads
awslocal s3api put-bucket-cors --bucket trato-hive-documents --cors-configuration '{
  "CORSRules": [{
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }]
}'

echo "S3 bucket configured with CORS support"
