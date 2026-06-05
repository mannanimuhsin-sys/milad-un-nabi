with open('App.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("teamObj?.name", "teamObj ? teamObj.name : ''")
content = content.replace("catObj?.name", "catObj ? catObj.name : ''")

with open('App.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced remaining ?.")
