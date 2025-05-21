/* eslint-disable */
import axios from 'axios';

export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (res.data.status === 'success') {
      window.setTimeout(() => {
        location.reload();
      }, 1500);
    }
  } catch (err) {
    alert(err.response.data.message);
  }
};
