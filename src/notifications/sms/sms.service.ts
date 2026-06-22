// import { Injectable } from '@nestjs/common';
// import axios from 'axios';

// @Injectable()
// export class SmsService {
//   async sendSms(phone: string, message: string) {
//     try {
//       const isProd = process.env.SMS_MODE === 'prod';

//       const payload: any = {
//         numbers: phone, // must be 10-digit
//         message,
//       };

//       let url = 'https://www.fast2sms.com/dev/bulkV2';

//       // ✅ DEV MODE (no sender id required)
//       if (!isProd) {
//         payload.route = 'v3';
//       }

//       // ✅ PRODUCTION MODE (DLT required)
//       if (isProd) {
//         payload.route = 'dlt';
//         payload.sender_id = process.env.SMS_SENDER_ID; // MUST be approved
//         payload.language = 'english';
//       }

//       const response = await axios.post(url, payload, {
//         headers: {
//           authorization:
//             process.env.FAST2SMS_API_KEY ||
//             'sDNM4xq91H8XJCcVQw5KuRhSilAvmrfEatUe07p3jPb2kWnFBYnF63wJkqBcxm14MviLOKhUogba7AGQ',
//           'Content-Type': 'application/json',
//         },
//       });

//       console.log('SMS RESPONSE:', response.data);

//       return {
//         success: response.data?.return === true,
//         data: response.data,
//       };
//     } catch (error) {
//       console.log('SMS ERROR:', error.response?.data || error.message);

//       return {
//         success: false,
//         error: error.response?.data || error.message,
//       };
//     }
//   }
// }


import { Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private client: Twilio;

  constructor() {
    this.client = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  async sendSms(phone: string, message: string) {
    try {
      const response = await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone.startsWith('+') ? phone : `+91${phone}`,
      });

      console.log('SMS RESPONSE:', response.sid);

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.log('SMS ERROR:', error?.message);

      return {
        success: false,
        error: error?.message,
      };
    }
  }
}