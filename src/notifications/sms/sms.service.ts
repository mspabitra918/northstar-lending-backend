import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SmsService {
  async sendSms(phone: string, message: string) {
    try {
      const isProd = process.env.SMS_MODE === 'prod';

      const payload: any = {
        numbers: phone, // must be 10-digit
        message,
      };

      let url = 'https://www.fast2sms.com/dev/bulkV2';

      // ✅ DEV MODE (no sender id required)
      if (!isProd) {
        payload.route = 'v3';
      }

      // ✅ PRODUCTION MODE (DLT required)
      if (isProd) {
        payload.route = 'dlt';
        payload.sender_id = process.env.SMS_SENDER_ID; // MUST be approved
        payload.language = 'english';
      }

      const response = await axios.post(url, payload, {
        headers: {
          authorization:
            process.env.FAST2SMS_API_KEY ||
            'sDNM4xq91H8XJCcVQw5KuRhSilAvmrfEatUe07p3jPb2kWnFBYnF63wJkqBcxm14MviLOKhUogba7AGQ',
          'Content-Type': 'application/json',
        },
      });

      console.log('SMS RESPONSE:', response.data);

      return {
        success: response.data?.return === true,
        data: response.data,
      };
    } catch (error) {
      console.log('SMS ERROR:', error.response?.data || error.message);

      return {
        success: false,
        error: error.response?.data || error.message,
      };
    }
  }
}
