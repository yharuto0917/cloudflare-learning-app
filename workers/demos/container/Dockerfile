# 依存ゼロの node:http サーバーを動かすだけの最小イメージ。
FROM node:22-alpine
WORKDIR /app
COPY server.mjs ./
ENV PORT=8080
# EXPOSE はローカル dev で必須(無いと "container port not found")。
EXPOSE 8080
CMD ["node", "server.mjs"]
