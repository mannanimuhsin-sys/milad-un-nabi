from PIL import Image

def remove_white_bg(image_path, output_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    newData = []
    # Using a threshold of 240 for white
    for item in datas:
        # If the pixel is close to white, make it transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print("Background removed successfully!")

if __name__ == "__main__":
    remove_white_bg("public/logo192.png", "public/logo192.png")
