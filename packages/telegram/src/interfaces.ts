export type IncomingTelegramMessage = {
  update_id: number;
  message: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username: string;
      language_code: string;
    };
    chat: {
      id: number;
      first_name: string;
      username: string;
      type: 'private' | 'group' | 'supergroup' | 'channel';
    };
    date: number;
    text: string;
    voice?: {
      duration: number;
      mime_type: string;
      file_id: string;
      file_unique_id: string;
      file_size: number;
    };
    entities?: {
      type: 'bot_command';
      offset: number;
      length: number;
    }[];
  };
};
