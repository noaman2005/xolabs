deploy-dev:
	cd backend && npm install && npm run build
	cd infra && sam build
	cd infra && sam deploy --stack-name xolabs-dev --capabilities CAPABILITY_IAM --parameter-overrides Environment=dev --region us-east-1
