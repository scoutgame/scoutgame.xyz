import fs from 'fs';
import { retrieveBouncedEmails } from '@packages/mailer/retrieveBouncedEmails';
import { prisma } from '@charmverse/core/prisma-client';
import { deleteSubscriptionByEmail } from '@packages/beehiiv/deleteSubscriptionByEmail';
import { deleteContact as deleteLoopsContact } from '@packages/loops/client';
// retrieve all bounced emails and save to file (takes a long time to run)
async function retrieveMailgunSupressed() {
  const allSupressed = await retrieveBouncedEmails();
  console.log('Saving results', allSupressed.length);
  // write to file
  fs.writeFileSync('supressed.json', JSON.stringify(allSupressed, null, 2));
}

// retrieveMailgunSupressed();

// read bounced emails and remove settings from users
// async function removeSettings() {
//   const allSupressed = fs.readFileSync('supressed.json', 'utf8');
//   const supressed = JSON.parse(allSupressed);
//   console.log('supressed', supressed.length);
//   const users = await prisma.scout.findMany({
//     where: {
//       email: {
//         in: supressed.map((s: any) => s.address)
//       }
//     },
//     select: {
//       id: true,
//       deletedAt: true,
//       email: true,
//       sendMarketing: true,
//       sendTransactionEmails: true
//     }
//   });
//   console.log('All users:', users.length);
//   console.log('deleted', users.filter((u) => u.deletedAt).length);
//   console.log('sendMarketing = true', users.filter((u) => !u.deletedAt && u.sendMarketing).length);
//   console.log('sendTransactionEmails = true', users.filter((u) => !u.deletedAt && u.sendTransactionEmails).length);
//   const toUpdate = users.filter((u) => !u.deletedAt && (u.sendTransactionEmails || u.sendMarketing));
//   console.log('remove settings:', toUpdate.length);

//   console.log(
//     'updated settings result',
//     await prisma.scout.updateMany({
//       where: {
//         id: {
//           in: toUpdate.map((u) => u.id)
//         }
//       },
//       data: { sendMarketing: false, sendTransactionEmails: false }
//     })
//   );
// }

// removeSettings();

async function deleteExternalSubscriptions() {
  const allSupressed = fs.readFileSync('supressed.json', 'utf8');
  const supressed = JSON.parse(allSupressed).map((s) => s.address);
  console.log('supressed', supressed.length);
  let deleted = 0;
  try {
    for (const email of supressed) {
      const index = supressed.indexOf(email);
      if (index > 13900) {
        await deleteLoopsContact({ email });
        await deleteSubscriptionByEmail({ email });
        if (index % 100 === 0) {
          console.log('deleted index:', index, email);
        }
        deleted++;
      }
    }
  } catch (e) {
    console.error('Error', e);
  }
  console.log('deleted', deleted);
}

deleteExternalSubscriptions();
