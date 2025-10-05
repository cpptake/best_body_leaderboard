FROM node:20-alpine

WORKDIR /app

# 依存関係のコピーとインストール
COPY package.json package-lock.json* ./
RUN npm install

# アプリケーションのコピー
COPY . .

# Next.jsのビルド
RUN npm run build

# ポート3000を公開
EXPOSE 3000

# アプリケーションの起動
CMD ["npm", "start"]
