FROM public.ecr.aws/lambda/nodejs:20

WORKDIR /var/task
COPY package.json package-lock.json* tsconfig.json ./
RUN npm install --only=production || yarn --production || true
COPY src ./src
RUN npm run build || yarn build || true

CMD ["dist/handlers/http/auth.handler"]
