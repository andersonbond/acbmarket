import React from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps extends RouteProps {
  component: React.ComponentType<any>;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ component: Component, ...rest }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Route
      {...rest}
      render={(props) => {
        if (isAuthenticated) {
          return <Component {...props} />;
        }
        // Use matched URL (e.g. /purchase) so return is correct even if IonReactRouter gives different location
        const returnPath = props.match.url + (props.location.search || '') + (props.location.hash || '');
        const isLoginPage = props.match.url === '/login' || returnPath.startsWith('/login?');
        const to = isLoginPage
          ? { pathname: '/login' }
          : { pathname: '/login', search: `?return=${encodeURIComponent(returnPath)}` };
        return <Redirect to={to} />;
      }}
    />
  );
};

export default ProtectedRoute;

