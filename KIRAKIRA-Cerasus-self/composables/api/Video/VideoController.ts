import * as tus from "tus-js-client";
import { DELETE, GET, POST, uploadFile2CloudflareImages } from "../Common";
import type { ApprovePendingReviewVideoRequestDto, ApprovePendingReviewVideoResponseDto, CheckVideoExistRequestDto, CheckVideoExistResponseDto, DeleteVideoRequestDto, DeleteVideoResponseDto, GetVideoByKvidRequestDto, GetVideoByKvidResponseDto, GetVideoByUidRequestDto, GetVideoByUidResponseDto, GetVideoCoverUploadSignedUrlResponseDto, PendingReviewVideoResponseDto, SearchVideoByVideoTagIdRequestDto, SearchVideoByVideoTagIdResponseDto, ThumbVideoResponseDto, UploadVideoRequestDto, UploadVideoResponseDto } from "./VideoControllerDto";

const BACK_END_URI = environment.backendUri;
const VIDEO_API_URI = `${BACK_END_URI}video`;

/**
 * 获取主页中显示的视频
 * @returns 展示视频卡片需要的返回参数
 */
export const getHomePageThumbVideo = async (headerCookie: { cookie?: string | undefined }): Promise<ThumbVideoResponseDto> => {
	// NOTE: use { headers: headerCookie } to passing client-side cookies to backend API when SSR.
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const { data: result } = await useFetch<ThumbVideoResponseDto>(`${VIDEO_API_URI}/home`, { headers: headerCookie, credentials: "include" });
	if (result.value)
		return result.value;
	else
		return { success: false, videosCount: 0, videos: [], message: "获取首页视频失败" };
};

/**
 * 根据视频 ID (KVID) 检验视频是否存在
 * @param CheckVideoExistRequest - 视频 ID (KVID)
 * @returns 视频是否存在的响应
 */
export const checkVideoExistByKvid = async (CheckVideoExistRequest: CheckVideoExistRequestDto): Promise<CheckVideoExistResponseDto> => {
	if (CheckVideoExistRequest && CheckVideoExistRequest.videoId) {
		const { data: result } = await useFetch<CheckVideoExistResponseDto>(`${VIDEO_API_URI}/exists?videoId=${CheckVideoExistRequest.videoId}`, { credentials: "include" });
		if (result.value)
			return result.value;
		else
			return { success: false, message: "视频不存在", exist: false };
	} else
		return { success: false, message: "未提供 KVID", exist: false };
};

/**
 * 根据视频 ID (KVID) 获取视频的数据
 * @param getVideoByKvidRequest - 从视频 ID 获取视频的请求参数
 * @param headerCookie - 从客户端发起 SSR 请求时传递的 Header 中的 Cookie 部分，在 SSR 时将其转交给后端 API
 * @returns 视频页面需要的响应
 */
export const getVideoByKvid = async (getVideoByKvidRequest: GetVideoByKvidRequestDto, headerCookie?: { cookie?: string | undefined }): Promise<GetVideoByKvidResponseDto> => {
	if (getVideoByKvidRequest && getVideoByKvidRequest.videoId) {
		// NOTE: use { headers: headerCookie } to passing client-side cookies to backend API when SSR.
		// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
		const { data: result } = await useFetch<GetVideoByKvidResponseDto>(`${VIDEO_API_URI}?videoId=${getVideoByKvidRequest.videoId}`, { headers: headerCookie, credentials: "include" });
		if (result.value)
			return result.value;
		else
			return { success: false, message: "获取视频失败", isBlockedByOther: false, isBlocked: false, isHidden: false };
	} else
		return { success: false, message: "未提供 KVID", isBlockedByOther: false, isBlocked: false, isHidden: false };
};

/**
 * 根据 UID 获取该用户上传的视频
 * @param getVideoByUidRequest - 根据 UID 获取该用户上传的视频的请求参数
 * @returns 根据 UID 获取该用户上传的视频的请求响应结果
 */
export const getVideoByUid = async (getVideoByUidRequest: GetVideoByUidRequestDto): Promise<GetVideoByUidResponseDto> => {
	if (getVideoByUidRequest && getVideoByUidRequest.uid) {
		const { data: result } = await useFetch<GetVideoByUidResponseDto>(`${VIDEO_API_URI}/user?uid=${getVideoByUidRequest.uid}`);
		if (result.value)
			return result.value;
		else
			return { success: false, message: "获取用户上传的视频失败", videosCount: 0, videos: [], isBlockedByOther: false, isBlocked: false, isHidden: false };
	} else
		return { success: false, message: "未提供 UID", videosCount: 0, videos: [], isBlockedByOther: false, isBlocked: false, isHidden: false };
};

/**
 * 根据关键字搜索视频
 * @param searchVideoByKeywordRequest - 根据关键字搜索视频的请求参数
 * @returns 根据关键字搜索视频的请求响应结果
 */
export const searchVideoByKeyword = async (searchVideoByKeywordRequest: SearchVideoByKeywordRequestDto): Promise<SearchVideoByKeywordResponseDto> => {
	if (searchVideoByKeywordRequest && searchVideoByKeywordRequest.keyword) {
		const { data: result } = await useFetch<SearchVideoByKeywordResponseDto>(`${VIDEO_API_URI}/search?keyword=${searchVideoByKeywordRequest.keyword}`);
		if (result.value)
			return result.value;
		else
			return { success: false, message: "根据关键字搜索视频失败", videosCount: 0, videos: [] };
	} else
		return { success: false, message: "未提供关键字", videosCount: 0, videos: [] };
};

/**
 * 根据 TAG ID 列表搜索视频
 * @param searchVideoByVideoTagIdRequest - 根据 TAG ID 列表搜索视频的请求参数
 * @returns 根据 TAG ID 列表搜索视频的请求响应结果
 */
export const searchVideoByTagIds = async (searchVideoByVideoTagIdRequest: SearchVideoByVideoTagIdRequestDto): Promise<SearchVideoByVideoTagIdResponseDto> => {
	if (searchVideoByVideoTagIdRequest && searchVideoByVideoTagIdRequest.tagId) {
		const { data: result } = await useFetch<SearchVideoByVideoTagIdResponseDto>(`${VIDEO_API_URI}/search/tag`, {
			method: "POST",
			body: { tagId: searchVideoByVideoTagIdRequest.tagId },
		});
		if (result.value)
			return result.value;
		else
			return { success: false, message: "根据 TAG ID 搜索视频失败", videosCount: 0, videos: [] };
	} else
		return { success: false, message: "未提供 TAG ID", videosCount: 0, videos: [] };
};

// 新しいHTTPアップロード関数を追加  
export async function uploadVideoFile(formData: FormData, onProgress?: (progress: number) => void): Promise<{ videoId: string }> {  
    return new Promise((resolve, reject) => {  
        const xhr = new XMLHttpRequest();  
          
        xhr.upload.addEventListener('progress', (e) => {  
            if (e.lengthComputable && onProgress) {  
                const progress = (e.loaded / e.total) * 100;  
                onProgress(progress);  
            }  
        });  
          
        xhr.addEventListener('load', () => {  
            if (xhr.status === 200) {  
                const response = JSON.parse(xhr.responseText);  
                resolve(response);  
            } else {  
                reject(new Error(`Upload failed: ${xhr.status}`));  
            }  
        });  
          
        xhr.addEventListener('error', () => {  
            reject(new Error('Upload failed'));  
        });  
          
        xhr.open('POST', `${VIDEO_API_URI}/upload-file`);  
        xhr.withCredentials = true;  
        xhr.send(formData);  
    });  
}

/**
 * 获取用于上传视频封面图的预签名 URL, 上传限时 60 秒
 * @returns 用于上传视频封面图的预签名 URL 请求响应
 */
export async function getVideoCoverUploadSignedUrl(): Promise<GetVideoCoverUploadSignedUrlResponseDto> {
	return (await GET(`${VIDEO_API_URI}/cover/preUpload`, { credentials: "include" })) as GetVideoCoverUploadSignedUrlResponseDto;
}

/**
 * 通过预签名 URL 上传视频封面图
 * @param fileName - 头像文件名
 * @param videoCoverBlobData - 用 Blob 编码的用户头像文件
 * @param signedUrl - 预签名 URL
 * @returns boolean 上传结果
 */
export async function uploadVideoCover(fileName: string, videoCoverBlobData: Blob, signedUrl: string): Promise<boolean> {
	try {
		await uploadFile2CloudflareImages(fileName, signedUrl, videoCoverBlobData, 60000);
		return true;
	} catch (error) {
		console.error("视频封面上传失败，错误信息：", error, { videoCoverBlobData, signedUrl });
		return false;
	}
}

/**
 * 提交已上传完成的视频
 * @param uploadVideoRequest - 视频数据
 * @returns 上传视频的请求响应
 */
export async function commitVideo(uploadVideoRequest: UploadVideoRequestDto): Promise<UploadVideoResponseDto> {
	return await POST(`${VIDEO_API_URI}/upload`, uploadVideoRequest, { credentials: "include" }) as UploadVideoResponseDto;
}

/**
 * 删除一个视频
 * @param deleteVideoRequest - 删除一个视频的请求载荷
 * @returns 删除一个视频的请求响应
 */
export async function deleteVideo(deleteVideoRequest: DeleteVideoRequestDto): Promise<DeleteVideoResponseDto> {
	return await DELETE(`${VIDEO_API_URI}/delete`, deleteVideoRequest, { credentials: "include" }) as DeleteVideoResponseDto;
}

/**
 * 获取待审核视频列表
 * @param headerCookie  - 从客户端发起 SSR 请求时传递的 Header 中的 Cookie 部分，在 SSR 时将其转交给后端 API
 * @returns 获取待审核视频列表的请求响应
 */
export const getPendingReviewVideo = async (headerCookie: { cookie?: string | undefined }): Promise<PendingReviewVideoResponseDto> => {
	// NOTE: use { headers: headerCookie } to passing client-side cookies to backend API when SSR.
	// TODO: use { credentials: "include" } to allow save/read cookies from cross-origin domains. Maybe we should remove it before deployment to production env.
	const { data: result } = await useFetch(`${VIDEO_API_URI}/pending`, { headers: headerCookie, credentials: "include" });
	return result.value as PendingReviewVideoResponseDto;
};

/**
 * 通过一个待审核视频
 * @param approvePendingReviewVideoRequest - 通过一个待审核视频的请求载荷
 * @returns 通过一个待审核视频的请求响应
 */
export async function approvePendingReviewVideo(approvePendingReviewVideoRequest: ApprovePendingReviewVideoRequestDto): Promise<ApprovePendingReviewVideoResponseDto> {
	return await POST(`${VIDEO_API_URI}/pending/approved`, approvePendingReviewVideoRequest, { credentials: "include" }) as ApprovePendingReviewVideoResponseDto;
}
