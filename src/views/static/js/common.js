/**
 * Created by lizude on 16/9/24.
 */
function logout() {
  $.ajax({
    url: '/logout',
    type: 'post',
    dataType: 'json',
    success: function (res) {
      if(res.code !== 0) {
        alert(res.msg);
        $("#password").val = '';
      } else {
        location.href = '/';
      }
    },

    error: function () {
      alert('网络请求出错! 请稍后再试!');
    }
  })
}

function login (name, password) {
  if(!name) {
    return alert('请输入用户名!');
  }
  if(!password) {
    return alert('请输入密码!');
  }

  $.ajax({
    url: '/login',
    type: 'post',
    dataType: 'json',
    data: {
      name: name,
      password: password
    },

    success: function (res) {
      if(res.code !== 0) {
        alert(res.msg);
        $("#password").val = '';
      } else {
        if(res.data.type === 1) {
          location.href = '/user/add';
        } else {
          location.href = '/invoice/add';
        }
      }
    },

    error: function () {
      alert('网络请求出错! 请稍后再试!');
    }
  })
}