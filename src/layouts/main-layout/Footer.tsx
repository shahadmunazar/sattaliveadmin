import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { useMemo } from 'react';

const Footer = () => {
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <Typography
      mt={1}
      px={1}
      pb={{ xs: 1.5, sm: 1, lg: 0 }}
      color="text.secondary"
      variant="body2"
      sx={{ textAlign: 'center', width: '100%' }}
      letterSpacing={0.5}
    >
      Made with ❤️ by{' '}
      <Link href="https://sattalives.com/" target="_blank" rel="noreferrer">
        Satta Live
      </Link>
      {' | '}
      &copy; {currentYear} Satta Live. All rights reserved.
    </Typography>
  );
};

export default Footer;
