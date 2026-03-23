import appMetadata from '@/metadata.json';

export const APP_NAME = typeof (appMetadata as any)?.name === 'string' ? (appMetadata as any).name : 'Energy-Task AI';
export const APP_SHORT_NAME = typeof (appMetadata as any)?.short_name === 'string' ? (appMetadata as any).short_name : 'Energy AI';
export const APP_DESCRIPTION = typeof (appMetadata as any)?.description === 'string'
  ? (appMetadata as any).description
  : 'Ứng dụng quản lý năng lượng và công việc tích hợp AI';

