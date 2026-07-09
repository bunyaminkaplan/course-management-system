import os
import sys
import subprocess
import platform
import time

def get_python_venv_cmd():
    backend_dir = os.path.join(os.getcwd(), 'backend')
    venv_dir = os.path.join(backend_dir, 'venv')
    if platform.system() == 'Windows':
        return os.path.join(venv_dir, 'Scripts', 'python')
    return os.path.join(venv_dir, 'bin', 'python')

def main():
    print("🚀 KBS Portal Baslatiliyor...")
    
    backend_dir = os.path.join(os.getcwd(), 'backend')
    frontend_dir = os.path.join(os.getcwd(), 'frontend')
    
    if not os.path.exists(backend_dir) or not os.path.exists(frontend_dir):
        print("HATA: Gecerli bir proje dizininde degilsiniz ('backend' ve 'frontend' klasorleri bulunamadi).")
        sys.exit(1)

    os_system = platform.system()
    python_venv_cmd = get_python_venv_cmd()
    npm_cmd = 'npm.cmd' if os_system == 'Windows' else 'npm'

    print("-> Backend (Django) sunucusu baslatiliyor...")
    backend_process = subprocess.Popen(
        [python_venv_cmd, 'manage.py', 'runserver'],
        cwd=backend_dir
    )

    print("-> Frontend (Vite) sunucusu baslatiliyor...")
    frontend_process = subprocess.Popen(
        [npm_cmd, 'run', 'dev'],
        cwd=frontend_dir,
        shell=(os_system == 'Windows')
    )

    print("\n✅ Sunucular calisiyor! Kapatmak icin 'Ctrl + C' tuslarina basin.\n")

    try:
        # Ana process'in bitmemesi icin bekliyoruz
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nKapatma sinyali alindi (Ctrl+C). Sunucular durduruluyor...")
        backend_process.terminate()
        frontend_process.terminate()
        backend_process.wait()
        frontend_process.wait()
        print("Gorusmek uzere!")

if __name__ == '__main__':
    main()
