import type { PageInviteEmailProps } from './templates/PageInviteEmail';
import { emailSubject, PageInviteEmail } from './templates/PageInviteEmail';
import type { PendingTasksProps } from './templates/PendingTasksTemplate';
import PendingTasks, { tasksRequiresYourAttention } from './templates/PendingTasksTemplate';
import { renderMJML } from './templates/utils';

export function getPendingTasksEmail(props: PendingTasksProps) {
  const html = renderMJML(PendingTasks(props));
  const subject = tasksRequiresYourAttention({ count: props.totalTasks, includeName: true });

  return { html, subject };
}

export function getPageInviteEmail(props: PageInviteEmailProps) {
  const html = renderMJML(PageInviteEmail(props));
  const subject = emailSubject(props);

  return { html, subject };
}
