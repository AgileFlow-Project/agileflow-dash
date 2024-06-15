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
    subject: 'You are invited to join to a AgileFlow board',
    html: `<div>
      <div style="height:100px; background-color:#26292c; color: white">
        <p>AgileFlow</p>
      <div>
      <div style="height:200px; background-color:#0079bf;">
        <a href='${url}/${page}?token=${emailData.token}&email=${email}&boardId=${emailData.boardId}'>Join</a>
      </div>
      <div style="height:100px; background-color:#26292c;">

      </div>
    </div>`
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
