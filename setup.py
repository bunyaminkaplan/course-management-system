import os
import sys
import subprocess
import platform
import shutil

# Renkli terminal ciktilari icin (macOS ve Linux'ta calisir)
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_step(msg):
    print(f"\n{Colors.OKCYAN}{Colors.BOLD}>>> {msg}{Colors.ENDC}")

def print_success(msg):
    print(f"{Colors.OKGREEN}✓ {msg}{Colors.ENDC}")

def print_error(msg):
    print(f"{Colors.FAIL}✗ HATA: {msg}{Colors.ENDC}")
    sys.exit(1)

def run_command(command, cwd=None, shell=False):
    try:
        if isinstance(command, str) and not shell:
            command = command.split()
        subprocess.run(command, cwd=cwd, check=True, shell=shell)
    except subprocess.CalledProcessError as e:
        print_error(f"Komut basarisiz oldu: {e}")
    except FileNotFoundError:
        print_error(f"Komut bulunamadi. Lutfen gerekli aracin kurulu oldugundan emin olun.")

def get_python_cmd():
    return 'python' if platform.system() == 'Windows' else 'python3'

def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass
    print(f"{Colors.HEADER}{Colors.BOLD}=== KBS Portal Otomatik Kurulum Araci ==={Colors.ENDC}\n")

    # 1. Projeyi Indirme (Git Clone)
    repo_url = ''
    project_dir = os.getcwd()

    if repo_url:
        print_step("Projeyi GitHub'dan indiriyor (Git Clone)...")
        # repodan klasor ismini cikarma (orn: course-management.git -> course-management)
        repo_name = repo_url.split('/')[-1].replace('.git', '')
        if os.path.exists(repo_name):
            print(f"{Colors.WARNING}Uyari: '{repo_name}' klasoru zaten var. Indirme atlaniyor.{Colors.ENDC}")
        else:
            run_command(['git', 'clone', repo_url])
            print_success("Proje basariyla indirildi.")
        
        project_dir = os.path.join(os.getcwd(), repo_name)
    else:
        print(f"{Colors.WARNING}Git linki girilmedi, kurulum mevcut klasorde ({project_dir}) devam ediyor...{Colors.ENDC}")

    backend_dir = os.path.join(project_dir, 'backend')
    frontend_dir = os.path.join(project_dir, 'frontend')

    if not os.path.exists(backend_dir) or not os.path.exists(frontend_dir):
        print_error("Gecerli bir proje dizininde degilsiniz. Lutfen indirdiginiz klasorun varligindan emin olun.")

    # 2. Isletim Sistemi Tespiti
    os_system = platform.system()
    print_step(f"Isletim Sistemi Tespit Edildi: {os_system}")
    python_cmd = get_python_cmd()

    # 3. Backend Kurulumu
    print_step("Backend (Django) Kurulumu Basliyor...")
    
    venv_dir = os.path.join(backend_dir, 'venv')
    if not os.path.exists(venv_dir):
        print("Sanal ortam (venv) olusturuluyor...")
        run_command([python_cmd, '-m', 'venv', 'venv'], cwd=backend_dir)
        print_success("Venv olusturuldu.")
    else:
        print("Sanal ortam zaten mevcut.")

    # Venv Pip yolunu belirleme
    if os_system == 'Windows':
        pip_cmd = os.path.join(venv_dir, 'Scripts', 'pip')
        python_venv_cmd = os.path.join(venv_dir, 'Scripts', 'python')
    else:
        pip_cmd = os.path.join(venv_dir, 'bin', 'pip')
        python_venv_cmd = os.path.join(venv_dir, 'bin', 'python')

    print("Kutuphaneler (requirements) indiriliyor...")
    run_command([pip_cmd, 'install', '-r', 'requirements.txt'], cwd=backend_dir)
    print_success("Kutuphaneler indirildi.")

    print("Veritabani tablolari olusturuluyor (Migrate)...")
    run_command([python_venv_cmd, 'manage.py', 'migrate'], cwd=backend_dir)
    print_success("Veritabani hazir.")

    print("Ornek (Seed) veriler basiliyor...")
    if os.path.exists(os.path.join(backend_dir, 'seeds', 'seed_1_basic.py')):
        run_command([python_venv_cmd, 'seeds/seed_1_basic.py'], cwd=backend_dir)
    if os.path.exists(os.path.join(backend_dir, 'seeds', 'seed_discussion.py')):
        run_command([python_venv_cmd, 'seeds/seed_discussion.py'], cwd=backend_dir)
    print_success("Ornek veriler basariyla eklendi.")

    # 4. Frontend Kurulumu
    print_step("Frontend (React/Vite) Kurulumu Basliyor...")
    print("NPM Paketleri indiriliyor (Bu islem biraz surebilir)...")
    # Windows'ta npm komutunu bulabilmek icin shell=True gerekiyor olabilir
    npm_cmd = 'npm.cmd' if os_system == 'Windows' else 'npm'
    run_command([npm_cmd, 'install'], cwd=frontend_dir, shell=(os_system == 'Windows'))
    print_success("NPM Paketleri indirildi.")

    # 5. Kapanis ve Basari
    print_step("KURULUM TAMAMLANDI! 🎉")
    print(f"""
    Projeyi calistirmak icin 2 ayri terminal acin:
    
    Terminal 1 (Backend):
    cd {os.path.basename(project_dir)}/backend
    {python_venv_cmd} manage.py runserver

    Terminal 2 (Frontend):
    cd {os.path.basename(project_dir)}/frontend
    {npm_cmd} run dev
    """)

if __name__ == '__main__':
    main()
