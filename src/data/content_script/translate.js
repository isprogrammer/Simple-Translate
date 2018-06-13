/* 
  Getting traslator's API token (TKK) from https://translate.google.com/
  Note: token (TKK) is attached to the page-scripts.
*/

window.addEventListener("load", function () {
  var script = document.createElement("script");
  script.textContent = "window.postMessage({'TKK': TKK}, '*')";
  document.body.appendChild(script);
});

window.addEventListener("message", function (e) {
  if (e.data && "TKK" in e.data) {
    background.send("GT-TKK", e.data["TKK"]);
  }
}, false);