import { DateTime } from 'luxon';
import { updateBuildersCardActivity } from '../tasks/updateBuildersCardActivity/updateBuildersCardActivity';

updateBuildersCardActivity(DateTime.utc())