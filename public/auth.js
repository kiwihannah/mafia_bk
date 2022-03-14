async function login(nickname) {
  try {
    const res = await axios.post("/", { nickname })
    console.log(res)
    console.log(res.data)
    if (res.status === 200) {
      const { user } = res.data
      console.log(user)
      localStorage.setItem("userInfo", JSON.stringify(user))
      window.location.replace("/dashboard")
    }
  } catch (err) {
    console.log(err)
  }
}
