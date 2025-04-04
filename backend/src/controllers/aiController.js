const { Configuration, OpenAIApi } = require('openai');
const BankingService = require('../services/bankingService');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

exports.processCommand = async (req, res) => {
  try {
    const { command, userId } = req.body;
    const bankingService = new BankingService();

    // Process the command using GPT
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a banking assistant. Parse the user's command and extract the banking operation and relevant parameters."
        },
        {
          role: "user",
          content: command
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const parsedCommand = completion.data.choices[0].message.content;
    
    // Process the parsed command and execute the corresponding banking operation
    let result;
    if (parsedCommand.includes('balance')) {
      result = await bankingService.getBalance(userId);
    } else if (parsedCommand.includes('transfer')) {
      const { amount, recipient } = extractTransferDetails(parsedCommand);
      result = await bankingService.transfer(userId, recipient, amount);
    } else if (parsedCommand.includes('transactions')) {
      result = await bankingService.getTransactions(userId);
    } else {
      return res.status(400).json({ message: 'Unsupported command' });
    }

    // Generate a natural language response
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful banking assistant. Format the result in a natural, conversational way."
        },
        {
          role: "user",
          content: `Format this result: ${JSON.stringify(result)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    res.json({
      result,
      response: response.data.choices[0].message.content
    });
  } catch (error) {
    console.error('AI processing error:', error);
    res.status(500).json({ message: 'Error processing command' });
  }
};

exports.processVoiceCommand = async (req, res) => {
  try {
    const { audioData, userId } = req.body;

    // Convert audio to text using a speech-to-text service
    // This is a placeholder - implement actual speech-to-text conversion
    const transcribedText = "placeholder text";

    // Process the transcribed text using the regular command processor
    req.body.command = transcribedText;
    return this.processCommand(req, res);
  } catch (error) {
    console.error('Voice processing error:', error);
    res.status(500).json({ message: 'Error processing voice command' });
  }
};

function extractTransferDetails(parsedCommand) {
  // Implement logic to extract amount and recipient from the parsed command
  // This is a placeholder implementation
  return {
    amount: 0,
    recipient: ''
  };
}
