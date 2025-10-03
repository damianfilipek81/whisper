- whisper.rn
  -- transcription works good in both english and polish (slightly worse, but acceptable)
  -- translate works good for english, not best for polish
  -- firstly i tried to use realtime transcription with translation, but it didn't perform well
  -- next i tried to record a voice massage and then try to transcript it and translate (works better, but still not enough)
  -- idea: find text-to-text model with possiblity to translation (e.g. we could transcribe polish and then using another text-to-text model translate it to english), the problem is that (during very quick research) the smallest translation model is already 4-bit quantized small-100 https://huggingface.co/BLCK-B/small100-quantized/tree/main (640mb big, imo too much for mobile app - but worth to try anyway)

- react-native-executorch
  -- works with different models (including whisper)
  -- easy API, love it

- chat
  -- tried both flash-list from shopify and legend-list, but seems that legend-list is still too much buggy

- styles library:
  -- love to use react-native-unistyles, it gives stylesheet-like API but with some cool things like built in insets, themes, breakpoints etc.

- backend:
  -- I approached this wrong - I assumed it would be just another "backend framework", something simple like Express or Fastify
  -- due to the problems I encountered, reality was completely different - I underestimated the complexity of this ecosystem
  -- all pears libraries are written in javascript (no typescript support, not even clear how to build TS to JS - tried with bun.js and esbuild but still issues since bare-pack uses its own libs instead of node modules)
  -- lots of problems due to missing types - constant guessing what APIs expect and return
  -- minimal documentation (no examples, very little info online)
  -- library names don't tell much - hyperswarm, hyperbee, autobase - hard to know what does what without diving into code
  -- connection handling can be tricky - connections drop, unclear when peers disconnect
  -- development workflow is rough - only native logs available, no proper debugging tools
  -- this isn't just a regular backend framework - it's an entire P2P ecosystem with its own concepts, protocols and architecture
  -- security needs to be properly reviewed and implemented - currently focused on getting basic functionality working
  -- would be nice to configure it so you could write in TypeScript and have transpilation to JS before bare-pack bundling

- messaging:
  -- message sending only handles happy path scenarios (same for voice messages)
  -- connection stability needs improvement - drops and reconnections not handled gracefully
  -- error handling and retry logic missing for failed message delivery
  -- haven't tested how peers behave when NOT on the same network - only tested locally
  -- reconnection when one peer disconnects takes tens of seconds - still working on improving this
  -- project has UI issues on Android platform that need to be addressed
  -- tested mostly on 2x iOS 13 and 1x pixel 7

- testing approach:
  -- I work by first writing UI and business logic, only adding tests when I don't see any obvious bugs
  -- still have things to improve and fix here, so writing tests didn't make sense yet
  -- generally I'm a fan of testing business logic only (UI testing only for complex components - but that creates problems on how to properly test it, since you can't 100% simulate RN native components behavior)

- state management:
  -- didn't see the need for it in this project, but if the app would grow I'd use zustand (my current favorite)
  -- previously used mobx-state-tree extensively, and before that redux-toolkit and redux

- development approach:
  -- I'm a fan of building simple MVPs first to validate if the idea works, then expanding with additional features
  -- prefer to get core functionality working before adding complexity or polish
  -- this project follows that pattern - basic P2P chat with voice messages as proof of concept

- overall reflection:
  -- made a big mistake with the backend choice - should have started with the unknown/risky part first
  -- got too hyped about using STT (speech-to-text) and underestimated the P2P networking complexity
  -- spent too much time on the "easy" parts (UI, audio recording) while the real challenge was the backend architecture
  -- lesson learned: always tackle the biggest unknowns and technical risks first in any project
