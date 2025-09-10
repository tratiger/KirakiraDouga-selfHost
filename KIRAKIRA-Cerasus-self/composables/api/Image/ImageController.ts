/**
 * MinIOに保存された画像ファイルのURLを生成
 * @param fileName - ファイル名
 * @returns MinIO画像ファイルURL
 */
export function getMinioImageUrl(fileName: string): string {
	const minioEndpoint = process.env.MINIO_END_POINT || "100.106.146.115:9000";
	const bucketName = process.env.MINIO_IMAGE_BUCKET || "videos"; // 画像用のバケット名
	const useSSL = process.env.MINIO_USE_SSL === "true";

	// NOTE: getMinioVideoUrlの実装を参考にしています。
	// なぜか変わらないのでハードコードしています。
	return `https://${minioEndpoint}/${bucketName}/${fileName}`;
	// return `${useSSL ? 'https' : 'http'}://${minioEndpoint}/${bucketName}/${fileName}`;
}