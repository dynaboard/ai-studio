pub mod shell {
    #[derive(serde::Serialize)]
    pub struct Output {
        stdout: String,
        stderr: String,
        status: i32,
    }

    #[tauri::command]
    pub async fn run_shell_script(script: String) -> Result<Output, String> {
        println!("Running shell script: {}", script);
        let args: Vec<String> = vec![];
        let output = tauri::api::process::Command::new(script)
            .args(args)
            .output();

        match output {
            Ok(output) => Ok(Output {
                stdout: output.stdout,
                stderr: output.stderr,
                status: output.status.code().unwrap_or_default(),
            }),
            Err(e) => {
                println!("Shell script error: {}", e);
                Err(e.to_string())
            }
        }
    }
}

pub use shell::run_shell_script;
