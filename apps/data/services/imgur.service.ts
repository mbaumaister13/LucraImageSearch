export class ImgurService {

  private static instance: ImgurService;

  public static getInstance() {
    if (!ImgurService.instance) {
      ImgurService.instance = new ImgurService();
    }
    return ImgurService.instance;
  }
}