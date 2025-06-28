import { PhotoLibraryService } from './PhotoLibraryService';

class UsageStatsService {
  public async calculateDeletableSpace(photoIds: string[]): Promise<number> {
    if (!photoIds || photoIds.length === 0) {
      return 0;
    }

    const photoLibraryService = PhotoLibraryService.getInstance();
    const result = await photoLibraryService.getPhotosByIds(photoIds);

    if (result.success && result.data) {
      return result.data.reduce((total, photo) => total + (photo.fileSize || 0), 0);
    }

    return 0;
  }

  public formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}

export default new UsageStatsService(); 