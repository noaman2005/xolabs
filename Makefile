deploy-dev:
	cd backend && npm install && npm run build
	cd infra && sam build
	cd infra && sam deploy --stack-name xolabs-dev --capabilities CAPABILITY_IAM --parameter-overrides Environment=dev --region us-east-1

local-dev:
	cd backend && npm install && npm run build
	cd infra && sam build
	sam local start-api -t infra/template.yaml -n sam-env.local.json --port 4000

