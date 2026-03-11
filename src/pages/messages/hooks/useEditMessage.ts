export const useEditMessage = () => {
  return {
    editMessage: async () => {
      throw new Error('Message editing is not supported by API');
    },
  };
};
