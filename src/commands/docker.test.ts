import { describe, expect, test } from "vitest";
import Converter from "./convert";
import { DockerCommand } from "./docker";
import Dreambooth from "./dreambooth";

describe("TestDocker", () => {
    test("Docker volume mapping", () => {
        const dockerCommand = new DockerCommand(
            { executable: "echo", arguments: ["hello"] },
            [["/path/to/a", "/a"]]
        );
        expect(dockerCommand.getCommand().arguments).toEqual([
            "run", "-t", "-v=/path/to/a:/a", "smy20011/dreambooth:latest", "echo", "hello"
        ]);
    });
    test("Docker additional arguments", () => {
        const dockerCommand = new DockerCommand(
            { executable: "echo", arguments: ["hello"] },
            [["/path/to/a", "/a"]],
            ["--gpu", "all"]
        );
        expect(dockerCommand.getCommand().arguments).toEqual([
            "run", "-t", "--gpu", "all", "-v=/path/to/a:/a", "smy20011/dreambooth:latest", "echo", "hello"
        ]);
    });

    test("Docker environment mapping", () => {
        const dockerCommand = new DockerCommand(
            { executable: "echo", arguments: ["hello"], environment: { 'HELLO': "world" } },
            [["/path/to/a", "/a"]],
        );
        expect(dockerCommand.getCommand().arguments).toEqual([
            "run", "-t", "-v=/path/to/a:/a", "-e", "HELLO=world", "smy20011/dreambooth:latest", "echo", "hello"
        ]);
    });

    test("Docker run convert ckpt", () => {
        let converter = new Converter("/a", "/b", "/convert.py")
        const dockerCommand = DockerCommand.runDiffusersToCkpt(converter);
        expect(converter.source).toEqual("/a");
        expect(converter.dest).toEqual("/b");
        expect(dockerCommand.getCommand().arguments).toEqual([
            "run", "-t", "--gpus=all", "-v=/a:/source", "-v=/b:/dest", "smy20011/dreambooth:latest", "python",
            "/convert.py", "--model_path=/source", "--checkpoint_path=/dest/model.ckpt",
        ]);
    });
    test("Docker run dreambooth training", () => {
        let dreambooth = new Dreambooth("sks", "");
        dreambooth.instanceDir = "/path/instance";
        dreambooth.outputDir = "/path/output";
        dreambooth.token = "abc";
        expect(DockerCommand.runDreambooth(dreambooth, "/cache").getCommand().arguments).toEqual([
            "run",
            "-t",
            "--gpus=all",
            "-v=/path/instance:/instance",
            "-v=/path/output:/output",
            "-v=/cache:/train",
            "-e",
            "HUGGING_FACE_HUB_TOKEN=abc",
            "smy20011/dreambooth:latest",
            "/start_training",
            "/train_dreambooth.py",
            "--pretrained_model_name_or_path=CompVis/stable-diffusion-v1-4",
            "--instance_prompt=sks",
            "--instance_data_dir=/instance",
            "--max_train_steps=600",
            "--learning_rate=6e-5",
            "--lr_scheduler=constant",
            "--lr_warmup_steps=0",
            "--save_interval=10000",
            "--save_min_steps=100000",
            "--resolution=512",
            "--output_dir=/output",
        ]);
    });
});