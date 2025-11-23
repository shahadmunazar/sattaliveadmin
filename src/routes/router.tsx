/* eslint-disable react-refresh/only-export-components */
import { Suspense, lazy } from 'react';
import { Outlet, createBrowserRouter } from 'react-router-dom';
import paths, { rootPaths } from './paths';
import MainLayout from 'layouts/main-layout';
import AuthLayout from 'layouts/auth-layout';
import Splash from 'components/loading/Splash';
import PageLoader from 'components/loading/PageLoader';
import ProfitLoss from 'pages/profit_loss';

const App = lazy(() => import('App'));
const Dashboard = lazy(() => import('pages/dashboard'));
const Login = lazy(() => import('pages/authentication/Login'));
const Signup = lazy(() => import('pages/authentication/Signup'));
const Category = lazy(() => import('pages/category/'));
const UserList = lazy(() => import('pages/users'));
const CreditList = lazy(() => import('pages/wallet'));
const GamesList = lazy(() => import('pages/games'));
const WithdrawalRequestComponent = lazy(() => import('pages/withdrawal'));
const  TodayNumber = lazy(() => import('pages/todaynumber'));
const JantriLists = lazy(() => import('pages/jantri'));
const ChangeContentRequest = lazy(()=> import('pages/content'));
const AddMoneyToUser = lazy(() => import('pages/addmoney'));
const UpdateTodayNumb  = lazy(() => import('pages/updateByAdmin'));
const AddProfitLoss =  lazy(() => import('pages/add_money_records'))
const HarupJantriLists  = lazy(() => import('pages/harupjantri'));

// HarupJantriLists
const router = createBrowserRouter(
  [
    {
      element: (
        <Suspense fallback={<Splash />}>
          <App />
        </Suspense>
      ),
      children: [
        {
          path: '/',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <Dashboard />,
            },
          ],
        },
        {
          path: '/add-money-to-user',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <AddMoneyToUser />,
            },
          ],
        },
        {
          path: '/open-number',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <TodayNumber />,
            },
          ],
        },

        {
          path: '/open-number-edit',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <UpdateTodayNumb />,
            },
          ],
        },
        {
          path: '/category',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <Category />,
            },
          ],
        },
        {
          path: '/users',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <UserList />,
            },
          ],
        },
        {
          path: '/money-request',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <CreditList />,
            },
          ],
        },
        {
          path: '/all-games',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <GamesList />,
            },
          ],
        },
        {
          path: '/all-withdrawal-request',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <WithdrawalRequestComponent />,
            },
          ],
        },
        {
          path: '/jantri',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <JantriLists />,
            },
          ],
        },
        {
          path: '/harup-jantri',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <HarupJantriLists />,
            },
          ],
        },
        {
          path: '/chaneg-content',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <ChangeContentRequest />,
            },
          ],
        },
        {
          path: '/user-records',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <ProfitLoss />,
            },
          ],
        },
        {
          path: '/user-transaction-records',
          element: (
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          ),
          children: [
            {
              index: true,
              element: <AddProfitLoss />,
            },
          ],
        },

        {
          path: rootPaths.authRoot,
          element: (
            <AuthLayout>
              <Outlet />
            </AuthLayout>
          ),
          children: [
            {
              path: paths.login,
              element: <Login />,
            },
            {
              path: paths.signup,
              element: <Signup />,
            },
          ],
        },
        
      ],
    },
  ],
  {
    basename: '/admin',
  },
);

export default router;
