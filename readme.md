## KiraKiraDouga
自分でホストする用です。cloudflareからminIOへのアーキテクチャ変更とユーザ権限の追加や招待コード機能の削除、ユーザ管理機能の完全実装を行います。

### 実行スクリプト
・開発環境では　フロント：pnpm install、pnpm dev-local  バック：pnpm install、pnpm run dev
以下まだ動作不完全
・本番環境では　フロント：pnpm build-local  バック：pnpm run build、distのバイナリ実行
フロントエンド：
cross-env VITE_BACKEND_URI=https://your-backend-url.com pnpm build  
cross-env VITE_BACKEND_URI=https://your-backend-url.com pnpm preview

### 注意
・envファイルを読み込んでください
・minIOに証明書が必要です。HTTPSでないとブラウザにmixted contentブロックされます。 .minio/certに追加
・動画が読み込めない場合は、証明書がブラウザにブロックされている可能性があるので、一度URLにアクセスして信頼してください。
・minIOのCORS設定をしてください
例：
$ mc alias set myminio https://minio.example:9000 minioadmin minioadmin
$ mc admin config set myminio api cors_allow_origin="https://frontend.example.com:3000"
#変更を有効化するために MinIO を再起動（systemd または docker restart）