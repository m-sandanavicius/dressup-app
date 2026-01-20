export const APP_NAME = process.env.NEXT_APP_NAME || 'DressUp';
export const APP_DESCRIPTION =
  process.env.NEXT_APP_DESCRIPTION || 'A big variety clothes store';
export const SERVER_URL =
  process.env.NEXT_SERVER_URL || 'http://localhost:3000';
export const LATEST_PRODUCTS_LIMIT =
  Number(process.env.LATEST_PRODUCTS_LIMIT) || 4;

export const signInDefaultValues = {
  email: '',
  password: '',
};

export const signUpDefaultValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export const shippingAddressDefaultValues = {
  fullName: 'John Boe',
  streetAddress: 'Ukmerges 19',
  city: 'Vilnius',
  postalCode: '04000',
  country: 'Lithuania',
};
