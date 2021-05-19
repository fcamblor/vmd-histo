import {mkdir} from "fs/promises";
import {cd, exec, ExecOptions, pwd, tempdir} from "shelljs";


export class GitService {
    public static readonly INSTANCE = new GitService();
    private localRepositoryRoot: string|undefined = undefined;
    private constructor() {
    }

    async synchronizeContent(fromTos: {from: string, to: string, avoidMkDir?: boolean}[]) {
        await this.ensureLocalRepoInitialized();

        const initialDir = pwd();
        const execOpts: ExecOptions = { silent: true };
        cd(`${this.localRepositoryRoot}`);
        try {
            fromTos.forEach(fromTo => {
                if(fromTo.to) {
                    exec(`git rm -rf ${fromTo.to}`, execOpts)
                }
            })
            fromTos.forEach(fromTo => {
                if(fromTo.to && !fromTo.avoidMkDir) {
                    exec(`mkdir -p ./${fromTo.to}`, execOpts)
                }
                exec(`cp -a ${fromTo.from} ./${fromTo.to}`)
                exec(`git add ./${fromTo.to}`, execOpts)
            })
            exec(`git commit -m "Synchronized content on ${new Date().toISOString()}"`, execOpts)
            exec(`git push origin published`, execOpts)
        }finally {
            cd(initialDir.stdout)
        }
    }

    private async ensureLocalRepoInitialized() {
        if(!this.localRepositoryRoot) {
            const localPath = `${tempdir()}/vmd-histo-${Date.now()}`;
            await mkdir(localPath, {recursive: true});
            exec(`git clone --branch published git@github.com:fcamblor/vmd-histo.git ${localPath}`)
            this.localRepositoryRoot = localPath;
            console.log(`git repository initialized in ${localPath}`)
        }
    }
}
