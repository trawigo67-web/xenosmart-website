import sys,json,subprocess,os,pathlib
from playwright.sync_api import sync_playwright
from cfg import build
name=sys.argv[1]; C=build(name)
here=pathlib.Path(__file__).parent.resolve(); out=here/'out'; out.mkdir(exist_ok=True)
if len(sys.argv)>2 and sys.argv[2]=='frames':
    times=[float(x) for x in sys.argv[3].split(',')]
else: times=None
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--no-sandbox","--allow-file-access-from-files","--font-render-hinting=none"])
    pg=b.new_page(viewport={"width":C['W'],"height":C['H']},device_scale_factor=1)
    pg.add_init_script("window.CFG="+json.dumps(C))
    pg.goto((here/'stage.html').as_uri()); pg.evaluate("window.ready")
    if times:
        for t in times:
            pg.evaluate("t=>render(t)",t); pg.screenshot(path=str(out/f"{name}_{t:06.2f}.jpg"),type="jpeg",quality=80)
        b.close(); sys.exit()
    tmp=out/f"{name}.tmp.mp4"; N=int(C['total']*30)
    ff=subprocess.Popen(["ffmpeg","-v","error","-y","-f","image2pipe","-framerate","30","-c:v","mjpeg","-i","-","-itsoffset",str(C['off']),"-i",str(here/'audio'/f"{name}.mp3"),"-map","0:v","-map","1:a","-c:v","libx264","-crf","19","-preset","veryfast","-pix_fmt","yuv420p","-vf","scale=in_range=full:out_range=tv","-c:a","aac","-b:a","160k","-af","apad","-t",str(C['total']),"-movflags","+faststart",str(tmp)],stdin=subprocess.PIPE)
    for i in range(N):
        pg.evaluate("t=>render(t)",i/30); ff.stdin.write(pg.screenshot(type="jpeg",quality=92))
    ff.stdin.close(); rc=ff.wait(); b.close()
    if rc==0: os.replace(tmp,out/f"{name}.mp4"); print("done",name,N)
    else: print("FAILED",name,rc)
