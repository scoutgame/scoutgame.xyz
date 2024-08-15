import { useTrackEvent } from '@connect-shared/hooks/useTrackEvent';
import { Button, Typography } from '@mui/material';
import Link from 'next/link';

const Icon = (
  <div
    style={{
      imageRendering: 'pixelated',
      flexShrink: 0,
      backgroundSize: '100% 100%',
      width: '32px',
      height: '29px',
      backgroundImage:
        "url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20xmlns%3Axlink%3D%22http%3A%2F%2Fwww.w3.org%2F1999%2Fxlink%22%20viewBox%3D%220%200%2032%2029%22%3E%3Cpath%20d%3D%22M%205.507%200.072%20L%2026.097%200.072%20L%2026.097%204.167%20L%2031.952%204.167%20L%2030.725%208.263%20L%2029.686%208.263%20L%2029.686%2024.833%20C%2030.207%2024.833%2030.63%2025.249%2030.63%2025.763%20L%2030.63%2026.88%20L%2030.819%2026.88%20C%2031.341%2026.88%2031.764%2027.297%2031.764%2027.811%20L%2031.764%2028.928%20L%2021.185%2028.928%20L%2021.185%2027.811%20C%2021.185%2027.297%2021.608%2026.88%2022.13%2026.88%20L%2022.319%2026.88%20L%2022.319%2025.763%20C%2022.319%2025.316%2022.639%2024.943%2023.065%2024.853%20L%2023.045%2015.71%20C%2022.711%2012.057%2019.596%209.194%2015.802%209.194%20C%2012.008%209.194%208.893%2012.057%208.559%2015.71%20L%208.539%2024.845%20C%209.043%2024.919%209.663%2025.302%209.663%2025.763%20L%209.663%2026.88%20L%209.852%2026.88%20C%2010.373%2026.88%2010.796%2027.297%2010.796%2027.811%20L%2010.796%2028.928%20L%200.218%2028.928%20L%200.218%2027.811%20C%200.218%2027.297%200.641%2026.88%201.162%2026.88%20L%201.351%2026.88%20L%201.351%2025.763%20C%201.351%2025.249%201.774%2024.833%202.296%2024.833%20L%202.296%208.263%20L%201.257%208.263%20L%200.029%204.167%20L%205.507%204.167%20L%205.507%200.072%20Z%22%20fill%3D%22rgb(255%2C%20255%2C%20255)%22%3E%3C%2Fpath%3E%3Cpath%20d%3D%22M%2026.097%200.072%20L%2026.166%200.072%20L%2026.166%200.004%20L%2026.097%200.004%20Z%20M%205.507%200.072%20L%205.507%200.004%20L%205.438%200.004%20L%205.438%200.072%20Z%20M%2026.097%204.167%20L%2026.028%204.167%20L%2026.028%204.235%20L%2026.097%204.235%20Z%20M%2031.952%204.167%20L%2032.019%204.187%20L%2032.045%204.099%20L%2031.952%204.099%20L%2031.952%204.167%20Z%20M%2030.725%208.263%20L%2030.725%208.331%20L%2030.776%208.331%20L%2030.791%208.282%20Z%20M%2029.686%208.263%20L%2029.686%208.195%20L%2029.617%208.195%20L%2029.617%208.263%20Z%20M%2029.686%2024.833%20L%2029.617%2024.833%20L%2029.617%2024.901%20L%2029.686%2024.901%20Z%20M%2030.63%2026.88%20L%2030.561%2026.88%20L%2030.561%2026.948%20L%2030.63%2026.948%20Z%20M%2031.764%2028.928%20L%2031.764%2028.996%20L%2031.832%2028.996%20L%2031.832%2028.928%20Z%20M%2021.185%2028.928%20L%2021.116%2028.928%20L%2021.116%2028.996%20L%2021.185%2028.996%20Z%20M%2022.319%2026.88%20L%2022.319%2026.948%20L%2022.388%2026.948%20L%2022.388%2026.88%20Z%20M%2023.065%2024.853%20L%2023.08%2024.919%20L%2023.134%2024.908%20L%2023.134%2024.853%20Z%20M%2023.045%2015.71%20L%2023.114%2015.71%20L%2023.114%2015.707%20L%2023.113%2015.704%20Z%20M%208.559%2015.71%20L%208.49%2015.704%20L%208.49%2015.707%20L%208.49%2015.71%20Z%20M%208.539%2024.845%20L%208.47%2024.845%20L%208.469%2024.904%20L%208.528%2024.913%20Z%20M%209.663%2026.88%20L%209.594%2026.88%20L%209.594%2026.948%20L%209.663%2026.948%20Z%20M%2010.796%2028.928%20L%2010.796%2028.996%20L%2010.865%2028.996%20L%2010.865%2028.928%20Z%20M%200.218%2028.928%20L%200.149%2028.928%20L%200.149%2028.996%20L%200.218%2028.996%20Z%20M%201.351%2026.88%20L%201.351%2026.948%20L%201.42%2026.948%20L%201.42%2026.88%20Z%20M%202.296%2024.833%20L%202.296%2024.901%20L%202.365%2024.901%20L%202.365%2024.833%20Z%20M%202.296%208.263%20L%202.365%208.263%20L%202.365%208.195%20L%202.296%208.195%20Z%20M%201.257%208.263%20L%201.191%208.282%20L%201.205%208.331%20L%201.257%208.331%20Z%20M%200.029%204.167%20L%200.029%204.1%20L%20-0.063%204.1%20L%20-0.037%204.187%20L%200.029%204.167%20Z%20M%205.507%204.167%20L%205.507%204.235%20L%205.576%204.235%20L%205.576%204.167%20Z%20M%2026.097%200.004%20L%205.507%200.004%20L%205.507%200.139%20L%2026.097%200.139%20Z%20M%2026.166%204.167%20L%2026.166%200.072%20L%2026.028%200.072%20L%2026.028%204.167%20L%2026.166%204.167%20Z%20M%2031.952%204.099%20L%2026.097%204.099%20L%2026.097%204.235%20L%2031.952%204.235%20Z%20M%2030.791%208.282%20L%2032.019%204.187%20L%2031.886%204.148%20L%2030.658%208.244%20Z%20M%2029.686%208.331%20L%2030.725%208.331%20L%2030.725%208.195%20L%2029.686%208.195%20Z%20M%2029.755%2024.833%20L%2029.755%208.263%20L%2029.617%208.263%20L%2029.617%2024.833%20Z%20M%2030.699%2025.763%20C%2030.699%2025.212%2030.245%2024.765%2029.686%2024.765%20L%2029.686%2024.9%20C%2030.169%2024.9%2030.561%2025.287%2030.561%2025.763%20Z%20M%2030.699%2026.88%20L%2030.699%2025.763%20L%2030.561%2025.763%20L%2030.561%2026.88%20Z%20M%2030.819%2026.813%20L%2030.63%2026.813%20L%2030.63%2026.948%20L%2030.819%2026.948%20Z%20M%2031.832%2027.811%20C%2031.832%2027.26%2031.379%2026.813%2030.819%2026.813%20L%2030.819%2026.948%20C%2031.303%2026.948%2031.695%2027.335%2031.695%2027.811%20Z%20M%2031.832%2028.928%20L%2031.832%2027.811%20L%2031.695%2027.811%20L%2031.695%2028.928%20Z%20M%2026.097%2028.996%20L%2031.764%2028.996%20L%2031.764%2028.86%20L%2026.097%2028.86%20Z%20M%2023.074%2028.996%20L%2026.097%2028.996%20L%2026.097%2028.86%20L%2023.074%2028.86%20Z%20M%2021.185%2028.996%20L%2023.074%2028.996%20L%2023.074%2028.86%20L%2021.185%2028.86%20Z%20M%2021.116%2027.811%20L%2021.116%2028.928%20L%2021.254%2028.928%20L%2021.254%2027.811%20Z%20M%2022.13%2026.813%20C%2021.57%2026.813%2021.116%2027.26%2021.116%2027.811%20L%2021.254%2027.811%20C%2021.254%2027.335%2021.646%2026.948%2022.13%2026.948%20Z%20M%2022.319%2026.813%20L%2022.13%2026.813%20L%2022.13%2026.948%20L%2022.319%2026.948%20Z%20M%2022.25%2025.763%20L%2022.25%2026.88%20L%2022.388%2026.88%20L%2022.388%2025.763%20Z%20M%2023.051%2024.787%20C%2022.593%2024.883%2022.25%2025.284%2022.25%2025.763%20L%2022.388%2025.763%20C%2022.388%2025.349%2022.684%2025.003%2023.08%2024.919%20Z%20M%2022.976%2015.71%20L%2022.996%2024.853%20L%2023.134%2024.853%20L%2023.114%2015.71%20Z%20M%2015.802%209.262%20C%2019.559%209.262%2022.645%2012.098%2022.976%2015.716%20L%2023.113%2015.704%20C%2022.776%2012.016%2019.632%209.126%2015.802%209.126%20Z%20M%208.628%2015.716%20C%208.959%2012.098%2012.044%209.262%2015.802%209.262%20L%2015.802%209.126%20C%2011.972%209.126%208.828%2012.016%208.49%2015.704%20Z%20M%208.608%2024.845%20L%208.628%2015.71%20L%208.49%2015.71%20L%208.47%2024.845%20Z%20M%209.732%2025.763%20C%209.732%2025.502%209.557%2025.273%209.331%2025.105%20C%209.104%2024.935%208.812%2024.817%208.549%2024.778%20L%208.528%2024.912%20C%208.769%2024.948%209.039%2025.057%209.248%2025.213%20C%209.459%2025.37%209.594%2025.563%209.594%2025.763%20Z%20M%209.732%2026.88%20L%209.732%2025.763%20L%209.594%2025.763%20L%209.594%2026.88%20Z%20M%209.852%2026.813%20L%209.663%2026.813%20L%209.663%2026.948%20L%209.852%2026.948%20Z%20M%2010.865%2027.811%20C%2010.865%2027.26%2010.411%2026.813%209.852%2026.813%20L%209.852%2026.948%20C%2010.335%2026.948%2010.727%2027.335%2010.727%2027.811%20Z%20M%2010.865%2028.928%20L%2010.865%2027.811%20L%2010.727%2027.811%20L%2010.727%2028.928%20Z%20M%208.529%2028.996%20L%2010.796%2028.996%20L%2010.796%2028.86%20L%208.529%2028.86%20Z%20M%208.372%2028.996%20L%208.529%2028.996%20L%208.529%2028.86%20L%208.372%2028.86%20Z%20M%205.507%2028.996%20L%208.372%2028.996%20L%208.372%2028.86%20L%205.507%2028.86%20Z%20M%200.218%2028.996%20L%205.507%2028.996%20L%205.507%2028.86%20L%200.218%2028.86%20Z%20M%200.149%2027.811%20L%200.149%2028.928%20L%200.287%2028.928%20L%200.287%2027.811%20Z%20M%201.162%2026.813%20C%200.603%2026.813%200.149%2027.26%200.149%2027.811%20L%200.287%2027.811%20C%200.287%2027.335%200.679%2026.948%201.162%2026.948%20Z%20M%201.351%2026.813%20L%201.162%2026.813%20L%201.162%2026.948%20L%201.351%2026.948%20Z%20M%201.282%2025.763%20L%201.282%2026.88%20L%201.42%2026.88%20L%201.42%2025.763%20Z%20M%202.296%2024.765%20C%201.736%2024.765%201.282%2025.212%201.282%2025.763%20L%201.42%2025.763%20C%201.42%2025.287%201.812%2024.9%202.296%2024.9%20Z%20M%202.227%208.263%20L%202.227%2024.833%20L%202.365%2024.833%20L%202.365%208.263%20Z%20M%201.257%208.331%20L%202.296%208.331%20L%202.296%208.195%20L%201.257%208.195%20Z%20M%20-0.037%204.187%20L%201.191%208.282%20L%201.323%208.244%20L%200.095%204.148%20Z%20M%205.507%204.099%20L%200.029%204.099%20L%200.029%204.235%20L%205.507%204.235%20L%205.507%204.099%20Z%20M%205.438%200.072%20L%205.438%204.167%20L%205.576%204.167%20L%205.576%200.072%20Z%22%20fill%3D%22rgb(255%2C255%2C255)%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E'"
    }}
  />
);

export function WarpcastButton({ text, href }: { text: string; href: string }) {
  const trackEvent = useTrackEvent();

  return (
    <Button
      LinkComponent={Link}
      size='large'
      variant='contained'
      href={href}
      rel='noopener noreferrer'
      target='_blank'
      startIcon={Icon}
      sx={{
        gap: 1,
        backgroundColor: 'farcaster.main',
        '&:hover': {
          backgroundColor: 'farcaster.dark'
        }
      }}
      onMouseDown={() => trackEvent('click_share_on_warpcast')}
    >
      <Typography component='span' sx={{ fontSize: '22px' }}>
        {text}
      </Typography>
    </Button>
  );
}
