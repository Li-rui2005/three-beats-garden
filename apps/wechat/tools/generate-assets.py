from pathlib import Path
import argparse, math, os, struct, wave
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'assets'
parser=argparse.ArgumentParser(description='Optional tool to regenerate packaged game artwork and audio.')
parser.add_argument('--font',type=Path,metavar='FONT.ttf',help='Path to a Chinese-capable TTF, TTC or OTF font. If omitted, try standard system font locations.')
args=parser.parse_args()
windows_fonts=Path(os.environ.get('WINDIR','C:/Windows'))/'Fonts'
candidates=[args.font.expanduser()] if args.font else [
 windows_fonts/'msyh.ttc',windows_fonts/'simhei.ttf',windows_fonts/'simsun.ttc',
 Path('/System/Library/Fonts/PingFang.ttc'),Path('/System/Library/Fonts/STHeiti Medium.ttc'),
 Path('/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'),
 Path('/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc'),
 Path('/usr/share/fonts/truetype/wqy/wqy-microhei.ttc')]
FONT_PATH=None
for candidate in candidates:
 if not candidate.is_file():continue
 try:ImageFont.truetype(str(candidate),24)
 except (OSError,ValueError):continue
 FONT_PATH=candidate.resolve();break
if FONT_PATH is None:
 parser.error('No readable Chinese-capable font found. Pass --font /path/to/font.ttf. This tool is only for regenerating assets; the packaged assets can be used without running it.')
(ASSETS/'audio').mkdir(parents=True,exist_ok=True)
S=2
def icon(draw,x,y,r,ghost=False):
 def box(a,b,c,d):return (int(a*S),int(b*S),int(c*S),int(d*S))
 if ghost:
  draw.rounded_rectangle(box(x-r,y-r,x+r,y+r),int(r*S),fill='#8cd4bd')
  draw.polygon([(int((x-r)*S),int(y*S)),(int((x+r)*S),int(y*S)),(int((x+r)*S),int((y+r*1.2)*S)),(int((x+r*.5)*S),int((y+r*.85)*S)),(int(x*S),int((y+r*1.2)*S)),(int((x-r*.5)*S),int((y+r*.85)*S)),(int((x-r)*S),int((y+r*1.2)*S))],fill='#8cd4bd')
 else:
  draw.ellipse(box(x-r,y-r+3,x+r,y+r+3),fill='#dfaa4f');draw.ellipse(box(x-r,y-r,x+r,y+r),fill='#f3c76e');draw.ellipse(box(x-r*.65,y-r*.63,x+r*.15,y-r*.25),fill='#ffe4a8');draw.ellipse(box(x-2,y-r*1.6,x+r*.6,y-r*.8),fill='#cce69a')
 for dx in (-r*.32,r*.32):draw.ellipse(box(x+dx-r*.09,y-r*.04,x+dx+r*.09,y+r*.2),fill='#36523b')
 draw.arc(box(x-r*.25,y+r*.15,x+r*.25,y+r*.6),0,180,fill='#64865a' if ghost else '#ad8445',width=max(1,int(S)))
def font(size):return ImageFont.truetype(str(FONT_PATH),round(size*S))
image=Image.new('RGB',(256*S,256*S),'#153c32');d=ImageDraw.Draw(image);d.ellipse((30*S,161*S,228*S,215*S),fill='#315b45');icon(d,162,141,44,True);icon(d,104,142,49)
for x,y,r in ((160,64,5),(183,67,4),(204,77,3)):d.ellipse(((x-r)*S,(y-r)*S,(x+r)*S,(y+r)*S),fill='#d1ec9e')
image.resize((256,256),Image.Resampling.LANCZOS).save(ASSETS/'icon.png')
card=Image.new('RGB',(500*S,400*S),'#153c32');d=ImageDraw.Draw(card)
d.text((34*S,26*S),'慢三拍',font=font(42),fill='#f3f2ea');d.text((36*S,92*S),'和过去的你，碰个面。',font=font(18),fill='#c9dfb6')
for row in range(3):
 for col in range(7):
  x=36+col*62;y=146+row*56;d.rounded_rectangle((x*S,y*S,(x+55)*S,(y+49)*S),radius=8*S,fill='#29503e' if (row+col)%2 else '#244b3c')
for i in range(4):d.ellipse(((173+i*30)*S,222*S,(178+i*30)*S,227*S),fill='#8cd4bd')
icon(d,130,225,23,True);icon(d,330,225,25)
d.text((36*S,341*S),'8 座花园 · 一点点默契',font=font(17),fill='#d1ec9e')
card.resize((500,400),Image.Resampling.LANCZOS).save(ASSETS/'share.png')
def sound(name,notes,length):
 rate=22050;samples=[]
 for i in range(int(length*rate)):
  t=i/rate;v=0
  for hz,start,duration in notes:
   p=t-start
   if 0<=p<duration:
    envelope=min(1,p/.012)*max(0,1-p/duration)**2
    v+=math.sin(2*math.pi*hz*p)*envelope*.28
  samples.append(struct.pack('<h',int(max(-.9,min(.9,v))*32767)))
 with wave.open(str(ASSETS/'audio'/name),'wb') as wav:wav.setparams((1,2,rate,0,'NONE','not compressed'));wav.writeframes(b''.join(samples))
sound('move.wav',[(440,0,.12)],.15)
sound('wait.wav',[(294,0,.16)],.18)
sound('blocked.wav',[(147,0,.08)],.10)
sound('win.wav',[(392,0,.32),(494,.1,.35),(587,.2,.36),(784,.3,.4)],.74)
print('Generated icon, 5:4 share card, and four local WAV effects.')
