declare module "jsmediatags/dist/jsmediatags.min.js" {
  const jsmediatags: {
    read(
      file: File | Blob | string,
      callbacks: {
        onSuccess: (result: { tags?: Record<string, any> }) => void;
        onError: (error: any) => void;
      }
    ): void;
  };
  export default jsmediatags;
}
