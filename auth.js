auth.onAuthStateChanged(user=>{
  if(!user){
    window.location.href = "login.html";
  } else {
    console.log("Connecté :", user.email);
  }
});

async function logout(){
  await auth.signOut();
  window.location.href = "login.html";
}
