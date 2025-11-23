// import paths from './paths';

export interface SubMenuItem {
  name: string;
  pathName: string;
  path: string;
  active?: boolean;
  items?: SubMenuItem[];
}

export interface MenuItem {
  id: string;
  subheader: string;
  path?: string;
  icon?: string;
  avatar?: string;
  active?: boolean;
  items?: SubMenuItem[];
}

const sitemap: MenuItem[] = [
  {
    id: 'dashboard',
    subheader: 'Dashboard',
    path: '/',
    icon: 'mingcute:home-1-fill',
    active: true,
  },
  {
    id: 'pricing',
    subheader: 'Add Money To User',
    path: '/add-money-to-user',
    icon: 'mingcute:currency-dollar-2-line',
    active: true,

  },
  {
    id: 'features',
    subheader: 'Open Number',
    path: '/open-number',
    icon: 'mingcute:star-fill',
    active: true,

  },
  {
    id: 'features',
    subheader: 'Open Number Edit',
    path: '/open-number-edit',
    icon: 'mingcute:star-fill',
    active: true,

  },
  
  {
    id: 'features',
    subheader: 'Category',
    path: '/category',
    icon: 'mingcute:star-fill',
    active: true,

  },
  {
    id: 'users',
    subheader: 'Users',
    path: '/users',
    icon: 'mingcute:user-2-fill',
    active: true,

  },
  {
    id: 'pricing',
    subheader: 'Add Request Money',
    path: '/money-request',
    icon: 'mingcute:currency-dollar-2-line',
    active: true,

  },
  {
    id: 'integrations',
    subheader: 'All Games',
    path: '/all-games',
    icon: 'mingcute:plugin-2-fill',
    active: true,

  },
  {
    id: 'integrations',
    subheader: 'All Withdrawal Requests',
    path: '/all-withdrawal-request',
    icon: 'mingcute:plugin-2-fill',
    active: true,

  },
  {
    id: 'integrations',
    subheader: 'Jantri',
    path: '/jantri',
    icon: 'mingcute:plugin-2-fill',
    active: true,

  },
  {
    id: 'integrations',
    subheader: 'Harup Jantri',
    path: '/harup-jantri',
    icon: 'mingcute:plugin-2-fill',
    active: true,

  },
  {
    id: 'integrations',
    subheader: 'Change Content',
    path: '/chaneg-content',
    icon: 'mingcute:plugin-2-fill',
    active: true,

  },
  {
    id: 'integrations',
    subheader: 'Record',
    path: '/user-records',
    icon: 'mingcute:plugin-2-fill',
    active: true,

  },
  {
    id: 'integrations',
    subheader: 'Add Withdrawal Record',
    path: '/user-transaction-records',
    icon: 'mingcute:plugin-2-fill',
    active: true,

  },
  

];

export default sitemap;
