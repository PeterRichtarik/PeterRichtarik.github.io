(function () {
  var items = [
    ["index.html", "News"],
    ["i_oldnews-2024.html", "Old News"],
    ["i_papers.html", "Papers"],
    ["i_talks.html", "Talks"],
    ["i_videotalks.html", "Video Talks"],
    ["i_events.html", "Events"],
    ["i_software.html", "Code"],
    ["i_team.html", "Team"],
    ["i_apply.html", "Apply"],
    ["i_bio.html", "Bio"],
    ["i_teaching.html", "Teaching"],
    ["i_consulting.html", "Consulting"]
  ];
  var file = window.location.pathname.split("/").pop() || "index.html";
  if (file === "" || file === "richtarik.org") file = "index.html";
  document.write('<ul class="menu">');
  for (var i = 0; i < items.length; i++) {
    var href = items[i][0];
    var label = items[i][1];
    var cls = "";
    if (file === href || (href === "i_oldnews-2024.html" && file.indexOf("i_oldnews") === 0)) cls = ' class="active"';
    document.write("<li><a" + cls + ' href="' + href + '">' + label + "</a></li>");
  }
  document.write("</ul>");
})();
