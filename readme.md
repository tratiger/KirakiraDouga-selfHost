# KiraKiraDouga-Libre

<img width="1344" height="768" alt="kirakira-Libre" src="https://github.com/user-attachments/assets/c6f0e7f6-e695-490c-a5e8-4f3c1b33be5b" />


## 概要

このプロジェクトは、KIRAKIRA☆DOUGA Project Teamによる素晴らしく芸術的なOSS[KIRAKIRADouga](https://github.com/KIRAKIRA-DOUGA)をフォークし、ストレージバックエンドをCloudflare R2系からMinIOに変更したものです。これにより、完全なセルフホスト環境での運用が可能になります。ほかにも、招待コード機能の削除や日本語への翻訳などローカルでの運用がしやすくしていく予定です。

**重要:** このプロジェクトは有志による派生版であり、オリジナルのKIRAKIRA☆DOUGA Project Teamによって公式に提供・保証・推奨されるものではありません。

## ライセンス
オリジナルのソフトウェアは、BSD3-Clauseのライセンスに基づいています。

## 実行スクリプト
・開発環境では　フロント：pnpm install、pnpm dev-local  バック：pnpm install、pnpm run dev

以下まだ動作不完全

・本番環境では　フロント：pnpm build-local  バック：pnpm run build、distのバイナリ実行

フロントエンド：

cross-env VITE_BACKEND_URI=https://your-backend-url.com pnpm build  

cross-env VITE_BACKEND_URI=https://your-backend-url.com pnpm preview

## 注意
・envファイルを読み込んでください

・動画が読み込めない場合は、証明書がブラウザにブロックされている可能性があるので、一度URLにアクセスして信頼してください。

・minIOのCORS設定をしてください

例：

$ mc alias set myminio https://minio.example:9000 minioadmin minioadmin

$ mc admin config set myminio api cors_allow_origin="https://frontend.example.com:3000"

#変更を有効化するために MinIO を再起動（systemd または docker restart）

## コミットメッセージ
- **feat**: 新しい機能
- **fix**: バグの修正
- **docs**: ドキュメントのみの変更
- **style**: 空白、フォーマット、セミコロン追加など
- **refactor**: 仕様に影響がないコード改善（リファクタ）
- **perf**: パフォーマンス向上関連
- **test**: テスト関連
- **chore**: ビルド、補助ツール、ライブラリ関連
