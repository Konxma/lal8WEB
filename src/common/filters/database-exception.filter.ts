import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Request, Response } from 'express';
@Catch(QueryFailedError)
export class DatabaseExceptionFilter implements ExceptionFilter {
 catch(error: QueryFailedError, host:ArgumentsHost) {
  const code = (error.driverError as {code?:string}).code;
  const known:Record<string,[number,string]> = {
   '23505':[409,'Запис із такою унікальною назвою вже існує'],
   '23503':[409,'Операція порушує зв’язок між записами'],
   '23514':[400,'Дані порушують обмеження бази даних'],
  };
  const [statusCode,message] = known[code || ''] || [500,'Помилка бази даних'];
  const ctx=host.switchToHttp();const request=ctx.getRequest<Request>();
  ctx.getResponse<Response>().status(statusCode).json({success:false,statusCode,timestamp:new Date().toISOString(),path:request.originalUrl,method:request.method,message:[message]});
 }
}
