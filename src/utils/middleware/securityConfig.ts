import rateLimit from "express-rate-limit";
import { envs } from "@/config/env/env";
import { LIMIT_REQUEST } from "@/core/mock/global";
import log from "@/services/logging/logger";



export const rateLimiting = rateLimit({
    max: envs.MAX_GLOBAL_QUERY_NUMBER,
    windowMs: envs.MAX_GLOBAL_QUERY_WINDOW,
    message: LIMIT_REQUEST.GLOBAL_ROUTE
})

export const rateLimitingSubRoute = rateLimit({
    max: envs.MAX_UNIQ_QUERY_NUMBER,
    windowMs: envs.MAX_UNIQ_QUERY_WINDOW,
    message: LIMIT_REQUEST.SUB_ROUTE
})

// export const credentials = {
// 	key: keys.tls.privateKey,
// 	cert: keys.tls.certificate
// }

export const morganFormat = ':method :url  :status :response-time ms' 
export const morganOptions = {
	stream: {
		write: (message: any) => log.http(message.trim())
	}
}