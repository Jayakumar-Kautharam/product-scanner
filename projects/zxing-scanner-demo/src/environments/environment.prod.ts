const baseUrl = 'https://us-central1-sails-development.cloudfunctions.net/';
export const environment = {
  production: true,
  userDetails:'USER_DETAILS',
  step2:'STEP2_ORDER_DETAILS',
  step2TrakingDetails:'STEP2_TRAKING_DETAILS',
  feedbackTrackerUrl:`${baseUrl}LogTypeFeedbackDetails/`,
  ShopifyUrl:`${baseUrl}ShopifyOrderService/`,
  RediesURL:'https://packordersbarcodescannerservice-783806104051.us-central1.run.app/',
};
