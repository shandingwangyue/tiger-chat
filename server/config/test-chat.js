const https = require('https');

// 流式生成函数
async function streamGenerate(prompt, model = "Qwen-7B-Chat.Q4_K_M") {
    const url = new URL('http://127.0.0.1:8000/api/v1/generate/stream');
    const payload = {
        model: model,
        prompt: prompt,
        max_tokens: 512,
        temperature: 0.7,
        stream: true
    };

    console.log(`正在连接到服务器: ${url}`);
    console.log(`发送请求: ${JSON.stringify(payload, null, 2)}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        console.log(`响应状态码: ${response.status}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.log(`错误响应: ${errorText}`);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.trim()) {
                    console.log(`收到数据: ${line}`); // 调试信息

                    if (line.startsWith('data: ')) {
                        const data = line.substring(6); // 去掉 'data: ' 前缀
                        if (data === '[DONE]') {
                            console.log('\n流式生成完成');
                            return;
                        }

                        try {
                            const parsed = JSON.parse(data);
                            // 自定义接口格式：包含 token 和 finished 字段
                            if (parsed.token && !parsed.finished) {
                                process.stdout.write(parsed.token);
                            } else if (parsed.error) {
                                console.log(`\n错误: ${parsed.error}`);
                                return;
                            }
                        } catch (e) {
                            console.log(`JSON解析错误: ${e.message}`);
                            continue;
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.log(`请求错误: ${error.message}`);
    }
}

// 普通文本生成函数
async function generateText(prompt, model = "Qwen-7B-Chat.Q4_K_M") {
    const url = 'http://localhost:8000/api/v1/generate';
    const payload = {
        prompt: prompt,
        model: model,
        max_tokens: 100,
        temperature: 0.7
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        // 自定义接口返回格式：包含 text、usage、latency
        if (result.text) {
            return result.text;
        } else if (result.error) {
            return `错误: ${result.error}`;
        } else {
            return JSON.stringify(result);
        }
    } catch (error) {
        return `请求错误: ${error.message}`;
    }
}

// 使用示例
async function main() {
    console.log('开始测试流式生成...');
    await streamGenerate('请解释人工智能的概念');
    
    console.log('\n开始测试普通生成...');
    const result = await generateText('请写一首关于春天的诗');
    console.log(result);
    console.log('\n测试完成');
}

// 运行主函数
main().catch(console.error);