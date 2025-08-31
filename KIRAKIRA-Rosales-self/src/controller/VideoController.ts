import { isPassRbacCheck } from '../service/RbacService.js'
import { approvePendingReviewVideoService, checkVideoExistByKvidService, deleteVideoByKvidService, getPendingReviewVideoService, getThumbVideoService, getVideoByKvidService, getVideoByUidRequestService, getVideoCoverUploadSignedUrlService, searchVideoByKeywordService, searchVideoByVideoTagIdService, updateVideoService, uploadVideoFileToMinioService } from '../service/VideoService.js'
import { koaCtx, koaNext } from '../type/koaTypes.js'
import { ApprovePendingReviewVideoRequestDto, CheckVideoExistRequestDto, DeleteVideoRequestDto, GetVideoByKvidRequestDto, GetVideoByUidRequestDto, GetVideoFileTusEndpointRequestDto, SearchVideoByKeywordRequestDto, SearchVideoByVideoTagIdRequestDto, UploadVideoRequestDto } from './VideoControllerDto.js'

/**
 * 上传视频
 * @param ctx context
 * @param next context
 * @returns 上传视频的结果
 */
export const updateVideoController = async (ctx: koaCtx, next: koaNext) => {
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')


	const data = ctx.request.body as Partial<UploadVideoRequestDto>
	const uploadVideoRequest: UploadVideoRequestDto = {
		title: data.title || '',
		videoPart: data.videoPart || [],
		image: data.image || '',
		uploaderId: data.uploaderId ?? -1,
		duration: data.duration ?? -1,
		description: data.description || '',
		videoCategory: data.videoCategory || '',
		copyright: data.copyright || '',
		originalAuthor: data.originalAuthor,
		originalLink: data.originalLink,
		pushToFeed: data.pushToFeed,
		ensureOriginal: data.ensureOriginal,
		videoTagList: data.videoTagList || [],
	}
	const esClient = ctx.elasticsearchClient
	const uploadVideoResponse = await updateVideoService(uploadVideoRequest, uid, token, esClient)
	ctx.body = uploadVideoResponse
	await next()
}

/**
 * 获取首页要显示的视频
 * // TODO: 现在还只是获取全部视频，未来优化为推荐视频
 * @param ctx context
 * @param next context
 * @returns 获取首页要显示的视频
 */
export const getThumbVideoController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const getThumbVideoResponse = await getThumbVideoService(uuid, token)
	ctx.body = getThumbVideoResponse
	await next()
}

/**
 * 根据 kvid 获取视频是否存在
 * @param ctx context
 * @param next context
 * @returns 获取视频是否存在
 */
export const checkVideoExistController = async (ctx: koaCtx, next: koaNext) => {
	const videoId = ctx.query.videoId as string
	const CheckVideoExistRequestDto: CheckVideoExistRequestDto = {
		videoId: videoId ? parseInt(videoId, 10) : -1, // WARN -1 means you can't find any video
	}
	const getVideoByKvidResponse = await checkVideoExistByKvidService(CheckVideoExistRequestDto)
	ctx.body = getVideoByKvidResponse
	await next()
}

/**
 * 根据 kvid 获取视频详细信息
 * @param ctx context
 * @param next context
 * @returns 获取视频信息
 */
export const getVideoByKvidController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const videoId = ctx.query.videoId as string
	const uploadVideoRequest: GetVideoByKvidRequestDto = {
		videoId: videoId ? parseInt(videoId, 10) : -1, // WARN -1 means you can't find any video
	}
	const getVideoByKvidResponse = await getVideoByKvidService(uploadVideoRequest, uuid, token)
	ctx.body = getVideoByKvidResponse
	await next()
}

/**
 * 根据 UID 获取该用户上传的视频
 * @param ctx context
 * @param next context
 * @returns 获取到的视频信息
 */
export const getVideoByUidController = async (ctx: koaCtx, next: koaNext) => {
	const uuid = ctx.cookies.get('uuid')
	const token = ctx.cookies.get('token')
	const uid = ctx.query.uid as string
	const getVideoByUidRequest: GetVideoByUidRequestDto = {
		uid: uid ? parseInt(uid, 10) : -1, // WARN -1 means you can't find any video
	}
	const getVideoByKvidResponse = await getVideoByUidRequestService(getVideoByUidRequest, uuid, token)
	ctx.body = getVideoByKvidResponse
	await next()
}

/**
 * 根据关键字搜索视频
 * @param ctx context
 * @param next context
 * @returns 获取到的视频信息
 */
export const searchVideoByKeywordController = async (ctx: koaCtx, next: koaNext) => {
	const keyword = ctx.query.keyword as string
	const searchVideoByKeywordRequest: SearchVideoByKeywordRequestDto = {
		keyword: keyword ?? '', // WARN '' means you can't find any video
	}
	const esClient = ctx.elasticsearchClient
	const searchVideoByKeywordResponse = await searchVideoByKeywordService(searchVideoByKeywordRequest, esClient)
	ctx.body = searchVideoByKeywordResponse
	await next()
}

/**
 * 获取视频文件 TUS 上传端点
 * @param ctx context
 * @param next context
 * @returns 获取到的视频信息
 */
// 新しいHTTPアップロードコントローラーを追加  
export const uploadVideoFileController = async (ctx: koaCtx, next: koaNext) => {
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')

	// 'files' が存在するかどうかを確認し、'videoFile' を取得
	const files = (ctx.request as any).files
	const videoFile = files ? files.videoFile : undefined

	// videoFileが存在しない、または配列の場合はエラーを返す
	if (!videoFile || Array.isArray(videoFile)) {
		ctx.status = 400
		ctx.body = { success: false, message: 'ビデオファイルが見つかりません。' }
		await next() // nextを呼んでからreturn
		return
	}

	// 修正後（型アサーションを追加）
	const data = ctx.request.body as { fileName?: string }
	const fileName = data?.fileName || videoFile.originalFilename || `video-${uid}-${Date.now()}`
	console.log('Received video file:', {
		originalFilename: videoFile.originalFilename,
		size: videoFile.size,
		mimetype: videoFile.mimetype,
		filepath: videoFile.filepath,
	});

	const uploadResult = await uploadVideoFileToMinioService(videoFile, fileName, uid, token)
	ctx.body = uploadResult
	await next()
}

/**
 * 获取用于上传视频封面图的预签名 URL
 * @param ctx context
 * @param next context
 * @returns 用于上传视频封面图的预签名 URL 请求响应
 */
export const getVideoCoverUploadSignedUrlController = async (ctx: koaCtx, next: koaNext) => {
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')
	ctx.body = await getVideoCoverUploadSignedUrlService(uid, token)
	await next()
}


/**
 * 根据视频 TAG ID 搜索视频数据
 * @param ctx context
 * @param next context
 * @returns 根据视频 TAG ID 搜索视频数据
 */
export const searchVideoByVideoTagIdController = async (ctx: koaCtx, next: koaNext) => {
	const data = ctx.request.body as Partial<SearchVideoByVideoTagIdRequestDto>
	const searchVideoByVideoTagIdRequest: SearchVideoByVideoTagIdRequestDto = {
		tagId: data.tagId ?? [],
	}

	ctx.body = await searchVideoByVideoTagIdService(searchVideoByVideoTagIdRequest)
	await next()
}

/**
 * 根据视频 ID 删除视频
 * @param ctx context
 * @param next context
 * @returns 根据视频 ID 删除视频的请求响应
 */
export const deleteVideoByKvidController = async (ctx: koaCtx, next: koaNext) => {
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')



	const data = ctx.request.body as Partial<DeleteVideoRequestDto>
	const deleteVideoRequest: DeleteVideoRequestDto = {
		videoId: data.videoId ?? -1,
	}

	const esClient = ctx.elasticsearchClient
	ctx.body = await deleteVideoByKvidService(deleteVideoRequest, uid, token, esClient)
	await next()
}

/**
 * 获取待审核视频列表
 * @param ctx context
 * @param next context
 * @returns 获取待审核视频列表的请求响应
 */
export const getPendingReviewVideoController = async (ctx: koaCtx, next: koaNext) => {
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')



	ctx.body = await getPendingReviewVideoService(uid, token)
	await next()
}

/**
 * 通过一个待审核视频
 * @param ctx context
 * @param next context
 * @returns 通过一个待审核视频的请求响应
 */
export const approvePendingReviewVideoController = async (ctx: koaCtx, next: koaNext) => {
	const uid = parseInt(ctx.cookies.get('uid'), 10)
	const token = ctx.cookies.get('token')


	const data = ctx.request.body as Partial<ApprovePendingReviewVideoRequestDto>
	const approvePendingReviewVideoRequest: ApprovePendingReviewVideoRequestDto = {
		videoId: data.videoId ?? -1,
	}

	ctx.body = await approvePendingReviewVideoService(approvePendingReviewVideoRequest, uid, token)
	await next()
}


