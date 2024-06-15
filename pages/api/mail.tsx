import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/util/mongodb';
import checkEnvironment from '@/util/check-environment';
import nodemailer from 'nodemailer';
import shortId from 'shortid';
import uniqid from 'uniqid';

const sendMail = async (email, res, emailData, user) => {
  const url = checkEnvironment();
  const page = 'signup';

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'You are invited to join an AgileFlow board',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #dcdcdc; border-radius: 10px;">
        <div style="background-color: #26292c; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: #ffffff; text-align: center;">AgileFlow</h1>
        </div>
        <div style="padding: 30px; background-color: #f4f4f4;">
          <h2 style="color: #0079bf;">You are Invited!</h2>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">You have been invited to join an AgileFlow board. Click the button below to accept the invitation and get started:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}/${page}?token=${emailData.token}&email=${email}&boardId=${emailData.boardId}" style="background-color: #0079bf; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-size: 16px;">Join AgileFlow</a>
          </div>
          <p style="font-size: 16px; color: #333;">If you did not expect this invitation, you can safely ignore this email.</p>
        </div>
        <div style="background-color: #26292c; padding: 20px; border-radius: 0 0 10px 10px; color: #ffffff; text-align: center;">
          <p>AgileFlow &copy; 2024</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.send({ message: 'Email sent successfully', status: 200 });
  } catch (error) {
    console.error(error);
    res.send({ message: 'Failed to send email', status: 500 });
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const { db, client } = await connectToDatabase();

  if (client.isConnected()) {
    const requestType = req.method;

    switch (requestType) {
      case 'POST': {
        const { email, boardId } = req.body;

        const token = uniqid();
        const id = shortId.generate();

        const emailData = {
          id,
          token,
          boardId
        };

        await db
          .collection('token')
          .insertOne({ token, userId: id, status: 'valid', email, boardId });
        const user = await db.collection('users').findOne({ email });

        await sendMail(email, res, emailData, user);

        return;
      }

      default:
        res.status(400).send({ message: 'DB error' });
        break;
    }
  } else {
    res.status(400).send({ msg: 'DB connection error' });
  }
}
